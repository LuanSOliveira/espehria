'use client';

import { Box, CircularProgress } from '@mui/material';
import { DefaultText } from '@/shared/components/Texts';
import { ISearchResult } from '@/shared/interfaces';
import { APP_INPUT_STYLES, ENTITY_MENTION_TYPE_LABELS } from '@/shared/constants';

export interface MentionSuggestionListProps {
  items: ISearchResult[];
  selectedIndex: number;
  onSelectItem: (item: ISearchResult) => void;
  isLoading?: boolean;
  isQueryTooShort?: boolean;
}

export const MentionSuggestionList = ({
  items,
  selectedIndex,
  onSelectItem,
  isLoading = false,
  isQueryTooShort = false,
}: MentionSuggestionListProps) => {
  if (isLoading) {
    return (
      <Box sx={APP_INPUT_STYLES.mentionSuggestionMenu}>
        <Box
          sx={[
            APP_INPUT_STYLES.mentionSuggestionItem,
            { display: 'flex', justifyContent: 'center', cursor: 'default' },
          ]}
        >
          <CircularProgress size={16} />
        </Box>
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box sx={APP_INPUT_STYLES.mentionSuggestionMenu}>
        <Box
          sx={[
            APP_INPUT_STYLES.mentionSuggestionItem,
            { cursor: 'default' },
          ]}
        >
          <DefaultText sx={{ margin: 0 }}>
            {isQueryTooShort
              ? 'Digite ao menos 2 caracteres para buscar'
              : 'Nenhuma entidade encontrada'}
          </DefaultText>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={APP_INPUT_STYLES.mentionSuggestionMenu}>
      {items.map((item, index) => (
        <Box
          key={item.id}
          onMouseDown={(event) => {
            event.preventDefault();
            onSelectItem(item);
          }}
          sx={[
            APP_INPUT_STYLES.mentionSuggestionItem,
            index === selectedIndex
              ? APP_INPUT_STYLES.mentionSuggestionItemActive
              : {},
          ]}
        >
          <DefaultText sx={{ margin: 0 }}>
            {item.name} (
            {ENTITY_MENTION_TYPE_LABELS[item.entityType] ?? item.entityType})
          </DefaultText>
        </Box>
      ))}
    </Box>
  );
};
