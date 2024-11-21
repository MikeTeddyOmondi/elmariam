import { get, writable } from "svelte/store";
import { axiosInstance } from "../interceptors/axios";
import { push } from "svelte-spa-router";

export const drinkStore = writable([]);
export const drinkCartItems = writable([]);

export async function getBarDrinks() {
  const response = await axiosInstance.get("/bar/drinks");
  const { drinks } = response.data.data;
  drinkStore.update(() => [...drinks]);
}

export function addToDrinkCart(drink) {
  let drinks = get(drinkCartItems);
  // console.log(drinks);

  // Increment amount if it exists
  for (let item of drinks) {
    if (item._id === drink._id) {
      item.amount++;
      drinkCartItems.set(drinks);
      return;
    }
  }

  // Otherwise, append it to cart
  const cartItem = { ...drink, amount: 1 };
  drinkCartItems.set([...drinks, cartItem]);
}

export async function removeFromDrinkCart(drinkId) {
  let items = get(drinkCartItems);

  // Decrease amount if it's above one, otherwise remove
  for (let item of items) {
    if (item._id === drinkId) {
      if (item.amount > 1) {
        item.amount--;
      } else {
        items = items.filter((item) => item._id !== drinkId);
      }
      drinkCartItems.set(items);
      return;
    }
  }
}
