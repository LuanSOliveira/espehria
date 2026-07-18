import Cookies from 'js-cookie';

export function setCookieAdapter(name: string, value: string) {
  Cookies.set(name, value, {
    secure: true,
    sameSite: 'strict',
    httpOnly: false,
  });
}

export function removeCookieAdapter(name: string) {
  Cookies.remove(name);
}

export function getCookieAdapter(name: string) {
  return Cookies.get(name);
}
