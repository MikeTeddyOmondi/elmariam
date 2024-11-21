import { writable } from "svelte/store";
import { axiosInstance } from "../interceptors/axios";

export const roomStore = writable([]);
export const drinkStore = writable([]);
export const usersStore = writable([]);
export const bookingStore = writable([]);
export const customerStore = writable([]);
export const roomTypeStore = writable([]);
export const bookingDetails = writable({});

export async function getAllCustomers() {
  const response = await axiosInstance.get("/hotel/customers");
  const { customers } = response.data.data;
  customerStore.update(() => [...customers]);
}

export async function getAllBookings() {
  const response = await axiosInstance.get("/hotel/bookings");
  const { bookings } = response.data.data;
  bookingStore.update(() => [...bookings]);
}

export async function getBarDrinks() {
  const response = await axiosInstance.get("/bar/drinks");
  const { drinks } = response.data.data;
  drinkStore.update(() => [...drinks]);
}
