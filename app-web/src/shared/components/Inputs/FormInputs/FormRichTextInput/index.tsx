'use client';

import { useEffect } from 'react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { Box, IconButton, Tooltip } from '@mui/material';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { FiBold, FiHash, FiItalic, FiList } from 'react-icons/fi';
import { BsListOl } from 'react-icons/bs';
import { Label } from '@/shared/components/Texts';
import { APP_INPUT_STYLES } from '@/shared/constants';

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
    extensions: [StarterKit],
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
