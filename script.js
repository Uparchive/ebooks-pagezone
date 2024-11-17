document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search-input");
    const books = document.querySelectorAll(".book");

    // Salvar o último livro acessado no localStorage
    books.forEach((book) => {
        book.addEventListener("click", function () {
            const bookId = this.getAttribute("data-book-id");
            if (bookId) {
                localStorage.setItem("lastVisitedBook", bookId);
            }
        });
    });

    // Função de pesquisa por título e gênero
    function searchBooks() {
        const query = searchInput.value.toLowerCase().trim();

        books.forEach((book) => {
            const title = book.getAttribute("data-title") ? book.getAttribute("data-title").toLowerCase() : "";
            const genre = book.getAttribute("data-genre") ? book.getAttribute("data-genre").toLowerCase() : "";

            if (title.includes(query) || genre.includes(query)) {
                book.style.display = "block";
            } else {
                book.style.display = "none";
            }
        });
    }

    // Vincular a função de pesquisa ao evento de input e ao botão
    if (searchInput) {
        searchInput.addEventListener("input", searchBooks);
        searchInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                searchBooks();
                const librarySection = document.getElementById("library");
                if (librarySection) {
                    librarySection.scrollIntoView({ behavior: "smooth" });
                }
            }
        });
    }

    const searchButton = document.querySelector(".search-btn");
    if (searchButton) {
        searchButton.addEventListener("click", function () {
            searchBooks();
            const librarySection = document.getElementById("library");
            if (librarySection) {
                librarySection.scrollIntoView({ behavior: "smooth" });
            }
        });
    }

    // Restabelecer o último livro visitado ao recarregar a página
    const lastVisitedBookId = localStorage.getItem("lastVisitedBook");
    if (lastVisitedBookId) {
        const lastVisitedBook = document.querySelector(`[data-book-id="${lastVisitedBookId}"]`);
        if (lastVisitedBook) {
            lastVisitedBook.scrollIntoView({ behavior: "smooth" });
            lastVisitedBook.classList.add("highlight");
            setTimeout(() => {
                lastVisitedBook.classList.remove("highlight");
            }, 2000);
        }
    }

    // Função para girar o cartão do livro
    const flipButtons = document.querySelectorAll(".flip-button");
    flipButtons.forEach((button) => {
        button.addEventListener("click", function () {
            const bookElement = button.closest(".book");
            if (bookElement) {
                bookElement.classList.toggle("flipped");
            }
        });
    });

    // Mostrar o botão "Voltar ao Topo" quando o usuário rolar a página
    const backToTopButton = document.getElementById("back-to-top");
    if (backToTopButton) {
        window.addEventListener("scroll", function () {
            if (window.scrollY > 300) {
                backToTopButton.style.display = "flex";
            } else {
                backToTopButton.style.display = "none";
            }
        });

        // Rolar para o topo ao clicar no botão "Voltar ao Topo"
        backToTopButton.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        // Adicionar efeito de animação ao botão "Voltar ao Topo"
        backToTopButton.addEventListener("mouseenter", function () {
            backToTopButton.style.transform = "scale(1.2) rotate(360deg)";
            backToTopButton.style.transition = "transform 0.5s ease";
        });
        backToTopButton.addEventListener("mouseleave", function () {
            backToTopButton.style.transform = "scale(1) rotate(0deg)";
        });
    }
});

/* Mostrar botão de voltar ao topo ao rolar */
window.addEventListener('scroll', function() {
    const backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
        if (window.scrollY > 300) {
            backToTopButton.style.display = 'flex';
        } else {
            backToTopButton.style.display = 'none';
        }
    }
});
