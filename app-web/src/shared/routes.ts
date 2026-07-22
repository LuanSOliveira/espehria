const MENU_ROUTES = {
  login: '/',
  home: '/home',
  users: '/usuarios',
  creatures: '/criaturas',
  tags: '/tags',
  locations: '/locais',
};

export const APP_ROUTES = {
  private: {
    home: MENU_ROUTES.home,
    users: MENU_ROUTES.users,
    creatures: MENU_ROUTES.creatures,
    tags: MENU_ROUTES.tags,
    locations: MENU_ROUTES.locations,
  },
  public: {
    login: MENU_ROUTES.login,
  },
};
