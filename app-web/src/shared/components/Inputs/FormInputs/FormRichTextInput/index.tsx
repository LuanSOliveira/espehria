'use client';

import { useEffect } from 'react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { Box, IconButton, Tooltip } from '@mui/material';
import { EditorContent, ReactRenderer, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { SuggestionOptions } from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { FiBold, FiHash, FiItalic, FiList } from 'react-icons/fi';
import { BsListOl } from 'react-icons/bs';
import { Label } from '@/shared/components/Texts';
import { APP_INPUT_STYLES } from '@/shared/constants';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { ISearchResult } from '@/shared/interfaces';
import { EntityMentionExtension } from '@/shared/components/RichTextViewer/EntityMentionExtension';
import {
  MentionSuggestionList,
  MentionSuggestionListProps,
} from './MentionSuggestionList';

const MENTION_MIN_QUERY_LENGTH = 2;
const MENTION_DEBOUNCE_MS = 300;

const createMentionItemsResolver = (
  onLoadingChange: (isLoading: boolean) => void,
) => {
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  let pendingResolve: ((items: ISearchResult[]) => void) | null = null;
  let latestRequestId = 0;

  return ({ query }: { query: string }): Promise<ISearchResult[]> => {
    const requestId = ++latestRequestId;

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      debounceTimeout = null;
    }

    if (pendingResolve) {
      pendingResolve([]);
      pendingResolve = null;
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < MENTION_MIN_QUERY_LENGTH) {
      onLoadingChange(false);
      return Promise.resolve([]);
    }

    onLoadingChange(true);

    return new Promise((resolve) => {
      pendingResolve = resolve;

      debounceTimeout = setTimeout(async () => {
        pendingResolve = null;

        try {
          const api = ApiFactory(getAuthToken());
          const { data } = await api.get<ISearchResult[]>('/search', {
            params: { query: trimmedQuery },
          });

          // Ignora respostas de requisições que já ficaram obsoletas (uma
          // busca mais recente foi iniciada antes desta responder).
          if (requestId !== latestRequestId) {
            return;
          }

          onLoadingChange(false);
          resolve(data);
        } catch {
          if (requestId === latestRequestId) {
            onLoadingChange(false);
            resolve([]);
          }
        }
      }, MENTION_DEBOUNCE_MS);
    });
  };
};

const createMentionSuggestion = (): Omit<SuggestionOptions<ISearchResult>, 'editor'> => {
  let notifyLoadingChange: ((isLoading: boolean) => void) | null = null;

  const resolveMentionItems = createMentionItemsResolver((isLoading) =>
    notifyLoadingChange?.(isLoading),
  );

  return {
    char: '@',
    items: resolveMentionItems,
    render: () => {
      let component: ReactRenderer<unknown, MentionSuggestionListProps> | null = null;
      let popup: TippyInstance[] | null = null;
      let selectedIndex = 0;
      let isLoading = false;

      const buildProps = (
        query: string,
        items: ISearchResult[],
        command: (item: ISearchResult) => void,
      ) => ({
        items,
        selectedIndex,
        isLoading,
        isQueryTooShort: query.trim().length < MENTION_MIN_QUERY_LENGTH,
        onSelectItem: command,
      });

      notifyLoadingChange = (loading) => {
        isLoading = loading;
        component?.updateProps({ isLoading });
      };

      return {
        onStart: (props) => {
          selectedIndex = 0;
          isLoading = false;

          component = new ReactRenderer(MentionSuggestionList, {
            props: buildProps(props.query, props.items, (item) => props.command(item)),
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy('body', {
            getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          });
        },

        onUpdate: (props) => {
          selectedIndex = 0;
          isLoading = false;
          component?.updateProps(
            buildProps(props.query, props.items, (item) => props.command(item)),
          );

          if (!props.clientRect) {
            return;
          }

          popup?.[0]?.setProps({
            getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
          });
        },

        onKeyDown: (props) => {
          if (props.event.key === 'Escape') {
            popup?.[0]?.hide();
            return true;
          }

          const items =
            (component?.props as MentionSuggestionListProps | undefined)?.items ?? [];

          if (items.length === 0) {
            return false;
          }

          if (props.event.key === 'ArrowDown') {
            selectedIndex = (selectedIndex + 1) % items.length;
            component?.updateProps({ selectedIndex });
            return true;
          }

          if (props.event.key === 'ArrowUp') {
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            component?.updateProps({ selectedIndex });
            return true;
          }

          if (props.event.key === 'Enter') {
            const selectedItem = items[selectedIndex];

            if (selectedItem) {
              (component?.props as MentionSuggestionListProps).onSelectItem(selectedItem);
            }

            return true;
          }

          return false;
        },

        onExit: () => {
          popup?.[0]?.destroy();
          component?.destroy();
        },
      };
    },
    command: ({ editor, range, props }) => {
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: 'mention',
            attrs: {
              id: props.id,
              entityType: props.entityType,
              label: props.name,
            },
          },
          { type: 'text', text: ' ' },
        ])
        .run();
    },
  };
};

export interface FormRichTextInputProps<TFieldValues extends FieldValues> {
  id: string;
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  label?: string;
  placeholder?: string;
}

interface RichTextEditorFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

const RichTextEditorField = ({
  id,
  value,
  onChange,
  placeholder,
  error,
}: RichTextEditorFieldProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      EntityMentionExtension.configure({
        suggestion: createMentionSuggestion(),
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  const isEmpty = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) =>
      !currentEditor || currentEditor.isEmpty,
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (editor.getHTML() !== (value || '<p></p>')) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const toolbarButtons = [
    {
      label: 'Negrito',
      icon: <FiBold />,
      isActive: editor.isActive('bold'),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: 'Itálico',
      icon: <FiItalic />,
      isActive: editor.isActive('italic'),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: 'Título',
      icon: <FiHash />,
      isActive: editor.isActive('heading', { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'Lista com marcadores',
      icon: <FiList />,
      isActive: editor.isActive('bulletList'),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Lista numerada',
      icon: <BsListOl />,
      isActive: editor.isActive('orderedList'),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ];

  return (
    <div>
      <Box sx={APP_INPUT_STYLES.richTextField}>
        <Box sx={APP_INPUT_STYLES.richTextToolbar}>
          {toolbarButtons.map((button) => (
            <Tooltip key={button.label} title={button.label}>
              <IconButton
                type="button"
                aria-label={button.label}
                size="small"
                onClick={button.onClick}
                sx={[
                  APP_INPUT_STYLES.richTextToolbarButton,
                  button.isActive
                    ? APP_INPUT_STYLES.richTextToolbarButtonActive
                    : {},
                ]}
              >
                {button.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>

        <Box sx={{ position: 'relative' }}>
          {placeholder && isEmpty && (
            <Box sx={APP_INPUT_STYLES.richTextPlaceholder}>{placeholder}</Box>
          )}
          <Box sx={APP_INPUT_STYLES.richTextContent}>
            <EditorContent editor={editor} />
          </Box>
        </Box>
      </Box>

      {error && <Box sx={APP_INPUT_STYLES.richTextError}>{error}</Box>}
    </div>
  );
};

export const FormRichTextInput = <TFieldValues extends FieldValues>({
  id,
  name,
  control,
  label,
  placeholder,
}: FormRichTextInputProps<TFieldValues>) => {
  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <RichTextEditorField
            id={id}
            value={field.value ?? ''}
            onChange={field.onChange}
            placeholder={placeholder}
            error={fieldState.error?.message}
          />
        )}
      />
    </div>
  );
};
