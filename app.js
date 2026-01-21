function toggleMenu(){
  const nav = document.querySelector(".nav");
  nav.classList.toggle("open");
}

// highlight current page in nav
(function(){
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach(a=>{
    if(a.getAttribute("href") === path) a.classList.add("active");
  });
})();
