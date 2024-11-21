<script>
  import Router from "svelte-spa-router";

  import Home from "./pages/Home.svelte";
  import Login from "./pages/Login.svelte";
  import Users from "./pages/Users.svelte";
  import UserDetails from "./pages/UserDetails.svelte";
  import Customers from "./pages/Customers.svelte";
  import CustomerDetails from "./pages/CustomerDetails.svelte";
  import Bookings from "./pages/Bookings.svelte";
  import RoomTypes from "./pages/RoomTypes.svelte";
  import Rooms from "./pages/Rooms.svelte";
  import BarDrinks from "./pages/BarDrinks.svelte";
  import ForgotPassword from "./pages/ForgotPassword.svelte";

  const routes = {
    "/": Home,
    "/login": Login,
    "/users": Users,
    "/users/:id": UserDetails,
    "/customers": Customers,
    "/customers/:id": CustomerDetails,
    "/bookings": Bookings,
    "/room-types": RoomTypes,
    "/rooms": Rooms,
    "/bar-drinks": BarDrinks,
    "/forgot-password": ForgotPassword,
  };
</script>

<Router {routes} />
