const waitFor = (delay) => {
  new Promise((resolve) => setTimeout(resolve, delay));
};

function printFunction() {
  window.print();
}

function capitalizeFirstLetter(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export { waitFor, printFunction, capitalizeFirstLetter };
