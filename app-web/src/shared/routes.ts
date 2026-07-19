const MENU_ROUTES = {
  login: '/',
  home: '/home',
  users: '/usuarios',
};

export const APP_ROUTES = {
  private: {
    home: MENU_ROUTES.home,
    users: MENU_ROUTES.users,
  },
  public: {
    login: MENU_ROUTES.login,
  },
};
