// Sai Priyan – Dashboard layout and navigation

const navLinks = document.querySelectorAll(".sidebar nav a");

navLinks.forEach(function (link) {
  link.addEventListener("click", function () {
    const targetId = link.getAttribute("href");
    const targetSection = document.querySelector(targetId);

    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: "smooth",
      });
    }
  });
});
