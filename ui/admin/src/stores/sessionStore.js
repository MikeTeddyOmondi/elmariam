import { writable } from "svelte/store";
import { axiosInstance } from "../interceptors/axios";
import { push } from "svelte-spa-router";

/**
 * `useLocalStorage` - localstorage store hook function
 * @param {string} key
 * @param {string} initialValue
 */
export function useLocalStorage(key, initialValue = "") {
  // initialValue = {};
  // let serialize = JSON.stringify;
  // let deserialize = JSON.parse;

  // get stored value
  // let storedValue = deserialize(localStorage.getItem(key));
  let storedValue = localStorage.getItem(key);

  // if value exists return it otherwise use initial value
  let store = writable(storedValue ? storedValue : initialValue);

  // subscribe to the store and update local storage when it changes
  store.subscribe((value) =>
    // localStorage.setItem(key, serialize(value))
    localStorage.setItem(key, value)
  );

  return store;
}

export const session = useLocalStorage("x-user-session");
export const authTokenStore = useLocalStorage("authToken");
export const refreshTokenStore = useLocalStorage("x-refresh-token");
export const sessionErrorStore = writable("");

async function getUserInfo() {
  const userInfoResponse = await axiosInstance.get("/auth/user");
  const user = userInfoResponse.data.data.user;
}

/**
 * `signIn` - Login function
 * @param {string} email
 * @param {string} password
 *
 */
export async function signIn(email, password) {
  try {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });
    console.log(response);

    if (response.status === 400) {
      console.log("response data", response.data);
      // sessionErrorStore.update(() => `${response?.data.data.message}`);
      return;
    }

    if (response.status === 200) {
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${response.data.data.accessToken}`;

      const { accessToken, refreshToken } = response.data.data;
      // localStorage.setItem("authToken", response.data.data.accessToken);
      authTokenStore.update(() => accessToken);

      // localStorage.setItem("x-refresh-token", response.data.data.refreshToken);
      refreshTokenStore.update(() => refreshToken);

      const userInfoResponse = await axiosInstance.get("/auth/user");
      const user = userInfoResponse.data.data.user;

      const { _id: id, username: alias } = user;
      const userInfo = {
        id,
        alias,
      };
      // console.log(userInfo);

      session.update(() => JSON.stringify(userInfo));
      // console.log(session);

      await push("/");
    }

    // response.status === 500
    // sessionErrorStore.update(() => `${response.data.data.message}`);
  } catch (err) {
    // response.status === 500
    sessionErrorStore.update(() => `${err.message}`);
  }
}
