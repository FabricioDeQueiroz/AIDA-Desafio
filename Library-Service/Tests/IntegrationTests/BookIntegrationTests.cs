using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace Library_Service.Tests.IntegrationTests;

public class BookIntegrationTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private async Task<AuthorDetailResponse> CreateAuthorAsync(string name, string nationality)
    {
        var payload = new { name, nationality };
        using var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync(new Uri("/author/", UriKind.Relative), content, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var createdAuthor = await DeserializeResponseAsync<AuthorDetailResponse>(response);
        Assert.NotNull(createdAuthor);

        return createdAuthor!;
    }

    private async Task<BookGetResponse> CreateBookAsync(Guid authorId, string title, string isbn)
    {
        var payload = new
        {
            title,
            isbn,
            year = (short)2021,
            quantity = 5,
            idAuthor = authorId
        };

        using var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync(new Uri("/book/", UriKind.Relative), content, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var createdBook = await DeserializeResponseAsync<BookGetResponse>(response);
        Assert.NotNull(createdBook);

        return createdBook!;
    }

    private async Task<LoanDetailResponse> CreateLoanAsync(Guid bookId)
    {
        var payload = new { borrowerName = "Fabrício de Queiroz", bookId };
        using var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync(new Uri("/loan/", UriKind.Relative), content, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var loan = await DeserializeResponseAsync<LoanDetailResponse>(response);
        Assert.NotNull(loan);

        return loan!;
    }

    private static async Task<T?> DeserializeResponseAsync<T>(HttpResponseMessage response)
    {
        await using var responseStream = await response.Content.ReadAsStreamAsync(TestContext.Current.CancellationToken);
        return await JsonSerializer.DeserializeAsync<T>(responseStream, JsonOptions, TestContext.Current.CancellationToken);
    }

    private sealed record AuthorDetailResponse(
        Guid IdAuthor,
        string Name,
        string? Nationality
    );

    private sealed record AuthorSummaryResponse(
        Guid IdAuthor,
        string Name,
        string? Nationality
    );

    private sealed record BookGetResponse(
        Guid IdBook,
        string Title,
        string Isbn,
        short Year,
        int Quantity,
        AuthorSummaryResponse Author
    );

    private sealed record LoanBookSummaryResponse(
        Guid IdBook,
        string Title,
        short Year
    );

    private sealed record LoanDetailResponse(
        Guid Id,
        string BorrowerName,
        LoanBookSummaryResponse Book
    );

    [Fact(DisplayName = "CreateBookSuccess - Integration")]
    public async Task CreateBookSuccess()
    {
        var author = await CreateAuthorAsync("Ariano Suassuna", "BR");

        var createdBook = await CreateBookAsync(author.IdAuthor, "Auto da Compadecida", "9788501068778");

        Assert.Equal("Auto da Compadecida", createdBook.Title);
        Assert.Equal("9788501068778", createdBook.Isbn);
        Assert.Equal(author.IdAuthor, createdBook.Author.IdAuthor);
        Assert.StartsWith("A", createdBook.Author.Name, StringComparison.OrdinalIgnoreCase);
    }

    [Theory(DisplayName = "CreateBookFail - Field Validation")]
    [InlineData("AB", "9788501068778", "Adélia Prado")]
    [InlineData("Aventuras de Ada", "123456789012", "Ana Prado")]
    [InlineData("Aventuras de Alan", "12345678901234", "Agatha Prado")]
    public async Task CreateBookFailValidation(string title, string isbn, string authorName)
    {
        var author = await CreateAuthorAsync(authorName, "BR");

        var invalidBook = new
        {
            title,
            isbn,
            year = (short)2020,
            quantity = 2,
            idAuthor = author.IdAuthor
        };

        using var content = new StringContent(JsonSerializer.Serialize(invalidBook), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync(new Uri("/book/", UriKind.Relative), content, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact(DisplayName = "CreateBookFail - Nonexistent author")]
    public async Task CreateBookFailNonexistentAuthor()
    {
        var invalidBook = new
        {
            title = "A Ilha Misteriosa",
            isbn = "9788572326975",
            year = (short)1874,
            quantity = 3,
            idAuthor = Guid.NewGuid()
        };

        using var content = new StringContent(JsonSerializer.Serialize(invalidBook), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync(new Uri("/book/", UriKind.Relative), content, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var responseBody = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Contains("autor", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact(DisplayName = "SearchBookSuccess - By title and isbn")]
    public async Task SearchBookByTitleOrIsbnSuccess()
    {
        var author = await CreateAuthorAsync("Arthur Conan Doyle", "GB");
        var createdBook = await CreateBookAsync(author.IdAuthor, "A Study in Scarlet", "9780486474915");

        var titleResponse = await _client.GetAsync(
            new Uri($"/book/title-isbn?title={Uri.EscapeDataString("Study")}", UriKind.Relative),
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, titleResponse.StatusCode);

        var booksByTitle = await DeserializeResponseAsync<List<BookGetResponse>>(titleResponse);
        Assert.NotNull(booksByTitle);
        Assert.Contains(booksByTitle!, b => b.IdBook == createdBook.IdBook);

        var isbnResponse = await _client.GetAsync(
            new Uri($"/book/title-isbn?isbn={createdBook.Isbn}", UriKind.Relative),
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, isbnResponse.StatusCode);

        var booksByIsbn = await DeserializeResponseAsync<List<BookGetResponse>>(isbnResponse);
        Assert.NotNull(booksByIsbn);
        Assert.Contains(booksByIsbn!, b => b.Isbn == createdBook.Isbn);
    }

    [Fact(DisplayName = "UpdateBookSuccess - Integration")]
    public async Task UpdateBookSuccess()
    {
        var originalAuthor = await CreateAuthorAsync("Anaïs Nin", "FR");
        var newAuthor = await CreateAuthorAsync("Alice Munro", "CA");

        var createdBook = await CreateBookAsync(originalAuthor.IdAuthor, "A Spy in the House of Love", "9780156027643");

        var updatePayload = new
        {
            idBook = createdBook.IdBook,
            title = "A Spy in the House of Love - Updated",
            isbn = "9780156027644",
            year = (short)1954,
            quantity = 9,
            idAuthor = newAuthor.IdAuthor
        };

        using var content = new StringContent(JsonSerializer.Serialize(updatePayload), Encoding.UTF8, "application/json");

        var updateResponse = await _client.PutAsync(
            new Uri($"/book/{createdBook.IdBook}", UriKind.Relative),
            content,
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var updatedBook = await DeserializeResponseAsync<BookGetResponse>(updateResponse);
        Assert.NotNull(updatedBook);
        Assert.Equal("A Spy in the House of Love - Updated", updatedBook!.Title);
        Assert.Equal("9780156027644", updatedBook.Isbn);
        Assert.Equal(newAuthor.IdAuthor, updatedBook.Author.IdAuthor);
    }

    [Fact(DisplayName = "DeleteBookFail - Book linked to active loan")]
    public async Task DeleteBookFailWhenBookHasLinkedLoan()
    {
        var author = await CreateAuthorAsync("Albert Camus", "FR");
        var createdBook = await CreateBookAsync(author.IdAuthor, "A Queda", "9788577993073");

        var createdLoan = await CreateLoanAsync(createdBook.IdBook);
        Assert.Equal(createdBook.IdBook, createdLoan.Book.IdBook);

        var deleteResponse = await _client.DeleteAsync(
            new Uri($"/book/{createdBook.IdBook}", UriKind.Relative),
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.Conflict, deleteResponse.StatusCode);

        var responseBody = await deleteResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Contains("empréstimos vinculados", responseBody, StringComparison.OrdinalIgnoreCase);
    }
}
