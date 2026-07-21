'use client';

import { Box, SxProps, Theme } from '@mui/material';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { DefaultText } from '@/shared/components/Texts';
import { isRichTextEmpty } from '@/shared/util';
import { APP_INPUT_STYLES } from '@/shared/constants';
import { ReadOnlyEntityMentionExtension } from './EntityMentionNodeView';

export interface RichTextViewerProps {
  value?: string | null;
  emptyLabel?: string;
  sx?: SxProps<Theme>;
  className?: string;
}

export const RichTextViewer = ({
  value,
  emptyLabel = 'Não informado',
  sx,
  className,
}: RichTextViewerProps) => {
  const isEmpty = isRichTextEmpty(value ?? undefined);

  const editor = useEditor(
    {
      extensions: [StarterKit, ReadOnlyEntityMentionExtension],
      content: value || '',
      editable: false,
      immediatelyRender: false,
    },
    [value],
  );

  if (isEmpty) {
    return <DefaultText>{emptyLabel}</DefaultText>;
  }

  if (!editor) {
    return null;
  }

  return (
    <Box
      className={className}
      sx={[
        APP_INPUT_STYLES.richTextContentLight,
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <EditorContent editor={editor} />
    </Box>
  );
};
