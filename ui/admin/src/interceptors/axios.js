import axios from "axios";

// axios.defaults.baseURL = "http://localhost:8009/api";
// axios.defaults.withCredentials = true;

export const axiosInstance = axios.create({
  baseURL: "http://localhost:8009/api",
  // withCredentials: true
});

let refresh = false;

axiosInstance.interceptors.request.use(
  (config) => {
    config.headers.Authorization = `Bearer ${localStorage.getItem(
      "authToken"
    )}`;
    return config;
  },
  async (error) => {
    console.log({ requestError: error });
    return error;
  }
);

axiosInstance.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    // console.log({ responseError: error });

    if (error.response.status === 401 && !refresh) {
      refresh = true;

      const response = await axiosInstance.post(
        "/auth/refresh",
        {},
        {
          // withCredentials: true,
          headers: {
            "x-refresh-token": `${localStorage.getItem("x-refresh-token")}`,
          },
        }
      );
      console.log({"AxiosResponse: ": response });

      if (response.status === 200) {
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.data.accessToken}`;

        localStorage.setItem("authToken", response.data.data.accessToken);

        return axios(error.config);
      }
      window.location.href = "/#/login";
      return;
    }
    refresh = false;
    return error;
  }
);
