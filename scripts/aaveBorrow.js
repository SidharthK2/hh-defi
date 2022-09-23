async function main() {}

main()
  .then(() => process.exit(0))
  .then((error) => {
    console.log(error);
    process.exit(1);
  });
