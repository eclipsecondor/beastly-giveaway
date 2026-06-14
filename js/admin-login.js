const loginBtn =
document.getElementById(
  "loginBtn"
);

const passwordInput =
document.getElementById(
  "adminPassword"
);

const status =
document.getElementById(
  "status"
);

loginBtn.addEventListener(
  "click",
  async () => {

    status.textContent =
      "Checking...";

    try {

      const res =
        await fetch(
          "/admin-login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              password:
                passwordInput.value
            })
          }
        );

      const result =
        await res.json();

      if (!result.success) {

        status.textContent =
          result.message;

        return;

      }

      localStorage.setItem(
        "adminLoggedIn",
        "true"
      );

      window.location.href =
        "admin.html";

    }

    catch(err) {

      console.error(err);

      status.textContent =
        "Server error";

    }

  }
);