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
    searchInput.addEventListener("input", function () {
        const query = searchInput.value.toLowerCase();

        books.forEach((book) => {
            const title = book.getAttribute("data-title").toLowerCase();
            const genre = book.getAttribute("data-genre").toLowerCase();

            if (title.includes(query) || genre.includes(query)) {
                book.style.display = "block";
            } else {
                book.style.display = "none";
            }
        });
    });

    // Lógica para dispositivos móveis: clique para mostrar descrição
    books.forEach((book) => {
        const link = book.querySelector("a");
        const description = book.querySelector(".book-description-hidden");

        link.addEventListener("click", function (event) {
            if (window.innerWidth <= 768) {
                const clicked = link.getAttribute("data-clicked") === "true";

                if (!clicked) {
                    event.preventDefault(); // Impede o redirecionamento no primeiro clique
                    description.style.bottom = "0";
                    link.setAttribute("data-clicked", "true");
                } else {
                    link.setAttribute("data-clicked", "false");
                }
            }
        });

        // Fechar descrição ao clicar fora (somente em dispositivos móveis)
        document.addEventListener("click", function (event) {
            if (!book.contains(event.target) && window.innerWidth <= 768) {
                description.style.bottom = "-100%";
                link.setAttribute("data-clicked", "false");
            }
        });
    });
});

// Função para girar o cartão do livro
function flipCard(button) {
    const bookElement = button.closest(".book");
    bookElement.classList.toggle("flipped");
}
