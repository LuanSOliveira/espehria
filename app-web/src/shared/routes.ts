const MENU_ROUTES = {
  login: '/',
  home: '/home',
  users: '/usuarios',
  creatures: '/criaturas',
  tags: '/tags',
  locations: '/locais',
  races: '/racas',
  eras: '/eras',
  events: '/eventos',
  divinities: '/divindades',
  characters: '/personagens',
  organizations: '/organizacoes',
};

export const APP_ROUTES = {
  private: {
    home: MENU_ROUTES.home,
    users: MENU_ROUTES.users,
    creatures: MENU_ROUTES.creatures,
    tags: MENU_ROUTES.tags,
    locations: MENU_ROUTES.locations,
    races: MENU_ROUTES.races,
    eras: MENU_ROUTES.eras,
    events: MENU_ROUTES.events,
    divinities: MENU_ROUTES.divinities,
    characters: MENU_ROUTES.characters,
    organizations: MENU_ROUTES.organizations,
  },
  public: {
    login: MENU_ROUTES.login,
  },
};
