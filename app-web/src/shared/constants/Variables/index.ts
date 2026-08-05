export const APP_DEFAULT_PAGE_SIZE = 20;

// FindTagsQueryDto (app-api) não impõe @Max em perPage (apenas @Min(1)), então
// não há restrição de backend para um valor alto; 1000 é uma folga confortável
// acima de qualquer volume realista do catálogo de tags do sistema.
export const TAG_OPTIONS_PER_PAGE = 1000;
