// script.js

document.addEventListener("DOMContentLoaded", function() {
    // Função para salvar o último livro acessado no localStorage
    document.querySelectorAll('.book').forEach(book => {
        book.addEventListener('click', function() {
            const bookId = this.dataset.bookId;
            localStorage.setItem("lastVisitedBook", bookId);
        });
    });

    // Função para pesquisar livros pelo título
    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener("input", function() {
        const query = searchInput.value.toLowerCase();
        document.querySelectorAll('.book').forEach(book => {
            const title = book.querySelector('.book-title').textContent.toLowerCase();
            if (title.includes(query)) {
                book.style.display = "block";
            } else {
                book.style.display = "none";
            }
        });
    });
});

// Função para girar o cartão do livro
function flipCard(button) {
    const bookElement = button.closest('.book');
    bookElement.classList.toggle('flipped');
}

