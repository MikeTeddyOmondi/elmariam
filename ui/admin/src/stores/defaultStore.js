import { writable } from "svelte/store";
import { axiosInstance } from "../interceptors/axios";

export const roomStore = writable([]);
export const drinkStore = writable([]);
export const usersStore = writable([]);
export const bookingStore = writable([]);
export const customerStore = writable([]);
export const roomTypeStore = writable([]);
export const bookingDetails = writable({});

let _customerObject = {
  _id: "",
  firstname: "",
  lastname: "",
  id_number: "",
  email: "",
  phone_number: 0,
  createdAt: "",
  updatedAt: "",
  __v: 0,
};

/**
 * `getAllCustomers` - Fetch All Customers
 * @returns {Promise}
 */
export async function getAllCustomers() {
  const response = await axiosInstance.get("/hotel/customers");
  const { customers } = response.data.data;
  customerStore.update(() => [...customers]);
}

/**
 * `getOneCustomers` - Fetch One Customer
 * @param {string} id
 * @returns {Promise<Object>} typeof {customerObject}
 */
export async function getOneCustomer(id) {
  const response = await axiosInstance.get(`/hotel/customers/${id}`);
  const { customer } = response.data.data;
  return customer;
}

/**
 * `editCustomerDetails` - Fetch One Customer
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Object>} typeof {customerObject}
 */
export async function editCustomerDetails(id, data) {
  const response = await axiosInstance.put(`/hotel/customers/${id}`, data);
  const { customer } = response.data.data;
  return customer;
}

/**
 * `getAllBookings` - Fetch All Bookings
 * @returns {Promise}
 */
export async function getAllBookings() {
  const response = await axiosInstance.get("/hotel/bookings");
  const { bookings } = response.data.data;
  bookingStore.update(() => [...bookings]);
}

/**
 * `getBarDrinks` - Fetch All Bar Drinks
 * @returns {Promise}
 */
export async function getBarDrinks() {
  const response = await axiosInstance.get("/bar/drinks");
  const { drinks } = response.data.data;
  drinkStore.update(() => [...drinks]);
}
