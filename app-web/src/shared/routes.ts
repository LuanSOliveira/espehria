const MENU_ROUTES = {
  login: '/',
  home: '/home',
  users: '/usuarios',
  creatures: '/criaturas',
  tags: '/tags',
};

export const APP_ROUTES = {
  private: {
    home: MENU_ROUTES.home,
    users: MENU_ROUTES.users,
    creatures: MENU_ROUTES.creatures,
    tags: MENU_ROUTES.tags,
  },
  public: {
    login: MENU_ROUTES.login,
  },
};
