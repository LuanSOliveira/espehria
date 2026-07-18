const MENU_ROUTES = {
  login: '/',
  home: '/home',
};

export const APP_ROUTES = {
  private: {
    home: MENU_ROUTES.home,
  },
  public: {
    login: MENU_ROUTES.login,
  },
};
