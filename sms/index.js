const app = require("./src/app");
const { PORT } = require("./src/config");

app.listen(PORT, () => {
  console.log(`> SMS service listening on: ${PORT}`);
});
