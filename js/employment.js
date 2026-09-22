const employmentForm =
  document.getElementById("employmentForm");

const employmentSubmitBtn =
  document.getElementById("employmentSubmitBtn");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB


/* =========================================================
   EMPLOYMENT POPUP ELEMENTS
   ========================================================= */

const employmentAlertModal =
  document.getElementById("employmentAlertModal");

const employmentAlertIcon =
  document.getElementById("employmentAlertIcon");

const employmentAlertTitle =
  document.getElementById("employmentAlertTitle");

const employmentAlertMessage =
  document.getElementById("employmentAlertMessage");

const employmentAlertClose =
  document.getElementById("employmentAlertClose");

const employmentAlertOk =
  document.getElementById("employmentAlertOk");

const employmentAlertBackdrop =
  employmentAlertModal?.querySelector(
    ".employment-popup-backdrop"
  );

let employmentAlertPreviousFocus = null;


/* =========================================================
   SHOW EMPLOYMENT POPUP
   ========================================================= */

function showEmploymentAlert(
  type = "info",
  title = "Notice",
  message = ""
) {
  if (!employmentAlertModal) {
    alert(message);
    return;
  }

  const alertConfig = {
    success: {
      icon: "✓"
    },

    info: {
      icon: "i"
    },

    warning: {
      icon: "!"
    },

    error: {
      icon: "×"
    }
  };

  const config =
    alertConfig[type] || alertConfig.info;

  employmentAlertPreviousFocus =
    document.activeElement;

  employmentAlertModal.className =
    `employment-popup ${type}`;

  employmentAlertIcon.textContent =
    config.icon;

  employmentAlertTitle.textContent =
    title;

  employmentAlertMessage.textContent =
    message;

  employmentAlertModal.classList.add("show");

  employmentAlertModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "employment-alert-open"
  );

  setTimeout(() => {
    employmentAlertOk?.focus();
  }, 50);
}


/* =========================================================
   CLOSE EMPLOYMENT POPUP
   ========================================================= */

function closeEmploymentAlert() {
  if (!employmentAlertModal) {
    return;
  }

  employmentAlertModal.classList.remove(
    "show"
  );

  employmentAlertModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "employment-alert-open"
  );

  if (
    employmentAlertPreviousFocus &&
    typeof employmentAlertPreviousFocus.focus ===
      "function"
  ) {
    employmentAlertPreviousFocus.focus();
  }
}


/* =========================================================
   POPUP EVENTS
   ========================================================= */

employmentAlertOk?.addEventListener(
  "click",
  closeEmploymentAlert
);

employmentAlertClose?.addEventListener(
  "click",
  closeEmploymentAlert
);

employmentAlertBackdrop?.addEventListener(
  "click",
  closeEmploymentAlert
);


/* Close popup with ESC */

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape" &&
      employmentAlertModal?.classList.contains(
        "show"
      )
    ) {
      closeEmploymentAlert();
    }
  }
);


/* =========================================================
   FORM SUBMISSION
   ========================================================= */

employmentForm.addEventListener(
  "submit",
  async (e) => {
    e.preventDefault();


    /* ---------------------------------------------
       REQUIRED FIELD VALIDATION
       --------------------------------------------- */

    if (!employmentForm.checkValidity()) {
      const firstInvalidField =
        employmentForm.querySelector(":invalid");

      showEmploymentAlert(
        "warning",
        "Incomplete Application",
        "Please complete all required fields before submitting your application."
      );

      firstInvalidField?.focus();

      return;
    }


    /* ---------------------------------------------
       GET FILES
       --------------------------------------------- */

    const idCard =
      document.getElementById("idCard").files[0];

    const cv =
      document.getElementById("cv").files[0];


    /* ---------------------------------------------
       ID CARD FILE SIZE
       --------------------------------------------- */

    if (
      idCard &&
      idCard.size > MAX_FILE_SIZE
    ) {
      showEmploymentAlert(
        "warning",
        "ID Card File Too Large",
        "Your ID card file is larger than 5MB. Please choose a smaller file and try again."
      );

      return;
    }


    /* ---------------------------------------------
       CV FILE SIZE
       --------------------------------------------- */

    if (
      cv &&
      cv.size > MAX_FILE_SIZE
    ) {
      showEmploymentAlert(
        "warning",
        "CV File Too Large",
        "Your CV file is larger than 5MB. Please choose a smaller file and try again."
      );

      return;
    }


    /* ---------------------------------------------
       BUILD FORM DATA
       --------------------------------------------- */

    const formData = new FormData();


    formData.append(
      "full_name",
      document
        .getElementById("fullName")
        .value
        .trim()
    );


    formData.append(
      "email",
      document
        .getElementById("email")
        .value
        .trim()
        .toLowerCase()
    );


    formData.append(
      "phone",
      document
        .getElementById("phone")
        .value
        .trim()
    );


    formData.append(
      "location",
      document
        .getElementById("location")
        .value
        .trim()
    );


    formData.append(
      "date_of_birth",
      document
        .getElementById("dateOfBirth")
        .value
    );


    formData.append(
      "id_type",
      document
        .getElementById("idType")
        .value
    );


    formData.append(
      "id_number",
      document
        .getElementById("idNumber")
        .value
        .trim()
    );


    formData.append(
      "employment_history",
      document
        .getElementById("employmentHistory")
        .value
        .trim()
    );


    formData.append(
      "experience",
      document
        .getElementById("experience")
        .value
        .trim()
    );


    formData.append(
      "motivation",
      document
        .getElementById("motivation")
        .value
        .trim()
    );


    formData.append(
      "availability",
      document
        .getElementById("availability")
        .value
    );


    formData.append(
      "additional_information",
      document
        .getElementById("additionalInformation")
        .value
        .trim()
    );


    /* ---------------------------------------------
       OPTIONAL FILES
       --------------------------------------------- */

    if (idCard) {
      formData.append(
        "id_card",
        idCard
      );
    }


    if (cv) {
      formData.append(
        "cv",
        cv
      );
    }


    /* ---------------------------------------------
       DISABLE SUBMIT BUTTON
       --------------------------------------------- */

    employmentSubmitBtn.disabled = true;

    employmentSubmitBtn.textContent =
      "Submitting...";


    /* ---------------------------------------------
       SUBMIT APPLICATION
       --------------------------------------------- */

    try {
      const response = await fetch(
        "/submit-employment-application",
        {
          method: "POST",
          body: formData
        }
      );


      const result =
        await response.json();


      /* ---------------------------------------------
         DUPLICATE APPLICATION
         --------------------------------------------- */

      if (
        response.status === 409 &&
        result.code ===
          "APPLICATION_ALREADY_EXISTS"
      ) {
        showEmploymentAlert(
          "info",
          "Application Already Received",
          result.error ||
            "You have already submitted an employment application using this email address. Your application has already been received. You will receive an email when there is an update regarding your application. Please also check your spam or junk folder."
        );


        employmentSubmitBtn.disabled =
          false;

        employmentSubmitBtn.textContent =
          "Submit Application";


        return;
      }


      /* ---------------------------------------------
         OTHER SERVER ERRORS
         --------------------------------------------- */

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to submit application."
        );
      }


      /* ---------------------------------------------
         SUCCESS
         --------------------------------------------- */

      employmentForm.reset();

      employmentSubmitBtn.textContent =
        "Application Submitted";


      showEmploymentAlert(
        "success",
        "Application Received",
        "Your employment application has been submitted successfully. Please check your email for confirmation and future updates. Please also check your spam or junk folder."
      );


    } catch (error) {

      console.error(
        "Employment application error:",
        error
      );


      showEmploymentAlert(
        "error",
        "Submission Failed",
        error.message ||
          "Something went wrong while submitting your application. Please try again."
      );


      employmentSubmitBtn.disabled =
        false;

      employmentSubmitBtn.textContent =
        "Submit Application";
    }
  }
);