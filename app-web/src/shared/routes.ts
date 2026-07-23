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
  },
  public: {
    login: MENU_ROUTES.login,
  },
};
