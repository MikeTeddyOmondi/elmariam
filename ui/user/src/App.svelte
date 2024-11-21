<script>
  import Router from 'svelte-spa-router';
  
  import Home from "./pages/Home.svelte"; 
  import Hotel from "./pages/Hotel.svelte"; 
  import Bar from "./pages/Bar.svelte"; 
  import Restaurant from "./pages/Restaurant.svelte"; 
  import Login from "./pages/Login.svelte";
  import Customers from "./pages/Customers.svelte";
  import Invoice from "./pages/Invoice.svelte";
  import Bookings from "./pages/Bookings.svelte";
  import RoomTypes from "./pages/RoomTypes.svelte";
  import Rooms from "./pages/Rooms.svelte";
  import ForgotPassword from "./pages/ForgotPassword.svelte";
  import DrinkCart from './pages/DrinkCart.svelte';

	const routes = {
		'/': Home,
    '/bar': Bar,
		'/login': Login,
    '/hotel': Hotel,
    '/invoices/bookings/:id': Invoice,
    '/rooms': Rooms,
    '/customers': Customers,
    '/drink-cart': DrinkCart,
    '/restaurant': Restaurant,
		'/forgot-password': ForgotPassword,
	};
</script>

<Router {routes}/>
