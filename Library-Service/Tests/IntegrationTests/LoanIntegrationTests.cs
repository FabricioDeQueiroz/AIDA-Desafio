using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace Library_Service.Tests.IntegrationTests;

public class LoanIntegrationTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private async Task<AuthorDetailResponse> CreateAuthorAsync(string name, string nationality = "BR")
    {
        var payload = new { name, nationality };

        using var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync(new Uri("/author/", UriKind.Relative), content, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var createdAuthor = await DeserializeResponseAsync<AuthorDetailResponse>(response);
        Assert.NotNull(createdAuthor);

        return createdAuthor!;
    }

    private async Task<BookGetResponse> CreateBookAsync(Guid authorId, string title, string isbn, int quantity = 2)
    {
        var payload = new
        {
            title,
            isbn,
            year = (short)2022,
            quantity,
            idAuthor = authorId
        };

        using var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync(new Uri("/book/", UriKind.Relative), content, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var createdBook = await DeserializeResponseAsync<BookGetResponse>(response);
        Assert.NotNull(createdBook);

        return createdBook!;
    }

    private async Task<LoanDetailResponse> CreateLoanAsync(Guid bookId, string borrowerName)
    {
        var payload = new { borrowerName, bookId };
        using var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync(new Uri("/loan/", UriKind.Relative), content, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var createdLoan = await DeserializeResponseAsync<LoanDetailResponse>(response);
        Assert.NotNull(createdLoan);

        return createdLoan!;
    }

    private static async Task<T?> DeserializeResponseAsync<T>(HttpResponseMessage response)
    {
        await using var responseStream = await response.Content.ReadAsStreamAsync(TestContext.Current.CancellationToken);
        return await JsonSerializer.DeserializeAsync<T>(responseStream, JsonOptions, TestContext.Current.CancellationToken);
    }

    private sealed record AuthorDetailResponse(Guid IdAuthor, string Name, string? Nationality);

    private sealed record BookGetResponse(Guid IdBook, string Title, string Isbn, short Year, int Quantity);

    private sealed record LoanBookSummaryResponse(Guid IdBook, string Title, short Year);

    private sealed record LoanDetailResponse(
        Guid Id,
        string BorrowerName,
        DateTime LoanDate,
        DateTime? ReturnDate,
        int Status,
        LoanBookSummaryResponse Book
    );

    private sealed record LoanGetResponse(
        Guid Id,
        string BorrowerName,
        DateTime LoanDate,
        DateTime? ReturnDate,
        int Status,
        string BookTitle
    );

    private sealed record PagedResultResponse<T>(
        IEnumerable<T> Items,
        int TotalCount,
        int Page,
        int Size
    );

    [Theory(DisplayName = "CreateLoanSuccess - Integration & Parametrized")]
    [InlineData("Alice Prado", "Ariano Loan", "Atlas do Backend", "9788501111111")]
    [InlineData("André Silva", "Adélia Loan", "Algoritmos na Prática", "9788501111112")]
    [InlineData("Amanda Souza", "Afonso Loan", "APIs com ASP.NET", "9788501111113")]
    [InlineData("Arthur Lima", "Aurora Loan", "Arquitetura Limpa", "9788501111114")]
    [InlineData("Aline Costa", "Anita Loan", "Análise de Sistemas", "9788501111115")]
    [InlineData("Ana Paula", "Aline Loan", "Automação de Testes", "9788501111116")]
    [InlineData("Alberto Nunes", "Alfred Loan", "Aprendendo SQL", "9788501111117")]
    [InlineData("Ayla Fernandes", "Amélia Loan", "Aventuras no CSharp", "9788501111118")]
    public async Task CreateLoanSuccess(string borrowerName, string authorName, string bookTitle, string isbn)
    {
        var author = await CreateAuthorAsync(authorName);
        var book = await CreateBookAsync(author.IdAuthor, bookTitle, isbn, quantity: 2);

        var loan = await CreateLoanAsync(book.IdBook, borrowerName);

        Assert.Equal(borrowerName, loan.BorrowerName);
        Assert.Equal(book.IdBook, loan.Book.IdBook);
        Assert.Equal(1, loan.Status);
    }

    [Fact(DisplayName = "CreateLoanFail - Book with zero quantity")]
    public async Task CreateLoanFailWhenBookHasZeroQuantity()
    {
        var author = await CreateAuthorAsync("Amanda Zero");
        var book = await CreateBookAsync(author.IdAuthor, "Arquivo Sem Estoque", "9788502222221", quantity: 0);

        var payload = new { borrowerName = "Ariane Leitora", bookId = book.IdBook };
        using var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync(new Uri("/loan/", UriKind.Relative), content, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var responseBody = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Contains("não há exemplares", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Theory(DisplayName = "CreateLoanFail - Borrower name validation")]
    [InlineData("Al", "Alberto Curto", "Almanaque da Validação I", "9788502222222")]
    [InlineData("Jo", "Alice Curta", "Almanaque da Validação II", "9788502222223")]
    public async Task CreateLoanFailBorrowerNameTooShort(string borrowerName, string authorName, string bookTitle, string isbn)
    {
        var author = await CreateAuthorAsync(authorName);
        var book = await CreateBookAsync(author.IdAuthor, bookTitle, isbn, quantity: 1);

        var invalidLoan = new { borrowerName, bookId = book.IdBook };
        using var content = new StringContent(JsonSerializer.Serialize(invalidLoan), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync(new Uri("/loan/", UriKind.Relative), content, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory(DisplayName = "ReturnLoanSuccess - Integration")]
    [InlineData("Ariel Reader", "Ariane Return", "Antologia de Retorno", "9788503333331")]
    [InlineData("Ariela Reader", "Alex Return", "Apostila de Retorno", "9788503333332")]
    public async Task ReturnLoanSuccess(string borrowerName, string authorName, string bookTitle, string isbn)
    {
        var author = await CreateAuthorAsync(authorName);
        var book = await CreateBookAsync(author.IdAuthor, bookTitle, isbn, quantity: 3);
        var createdLoan = await CreateLoanAsync(book.IdBook, borrowerName);

        var returnResponse = await _client.PutAsync(
            new Uri($"/loan/{createdLoan.Id}", UriKind.Relative),
            content: null,
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, returnResponse.StatusCode);

        var returnedLoan = await DeserializeResponseAsync<LoanDetailResponse>(returnResponse);
        Assert.NotNull(returnedLoan);
        Assert.Equal(2, returnedLoan!.Status);
        Assert.NotNull(returnedLoan.ReturnDate);
    }

    [Fact(DisplayName = "ReturnLoanFail - Already returned")]
    public async Task ReturnLoanFailAlreadyReturned()
    {
        var author = await CreateAuthorAsync("Arthur Duplicado");
        var book = await CreateBookAsync(author.IdAuthor, "Arquivo de Devolução", "9788504444441", quantity: 2);
        var createdLoan = await CreateLoanAsync(book.IdBook, "Afonso Barros");

        var firstReturnResponse = await _client.PutAsync(
            new Uri($"/loan/{createdLoan.Id}", UriKind.Relative),
            content: null,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(HttpStatusCode.OK, firstReturnResponse.StatusCode);

        var secondReturnResponse = await _client.PutAsync(
            new Uri($"/loan/{createdLoan.Id}", UriKind.Relative),
            content: null,
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.BadRequest, secondReturnResponse.StatusCode);

        var responseBody = await secondReturnResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Contains("já foi devolvido", responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact(DisplayName = "ListLoansSuccess - Without status filter")]
    public async Task ListLoansWithoutStatusFilter()
    {
        var author = await CreateAuthorAsync("Alice Listagem");
        var activeBook = await CreateBookAsync(author.IdAuthor, "Agenda Ativa", "9788505555551", quantity: 2);
        var returnedBook = await CreateBookAsync(author.IdAuthor, "Agenda Retornada", "9788505555552", quantity: 2);

        var activeLoan = await CreateLoanAsync(activeBook.IdBook, "Alice Active");
        var returnedLoan = await CreateLoanAsync(returnedBook.IdBook, "André Returned");

        var returnResponse = await _client.PutAsync(
            new Uri($"/loan/{returnedLoan.Id}", UriKind.Relative),
            content: null,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(HttpStatusCode.OK, returnResponse.StatusCode);

        var listResponse = await _client.GetAsync(
            new Uri("/loan?page=1&size=100", UriKind.Relative),
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        var listData = await DeserializeResponseAsync<PagedResultResponse<LoanGetResponse>>(listResponse);
        Assert.NotNull(listData);
        Assert.Contains(listData!.Items, l => l.Id == activeLoan.Id);
        Assert.Contains(listData.Items, l => l.Id == returnedLoan.Id);
    }

    [Fact(DisplayName = "ListLoansSuccess - With status filter")]
    public async Task ListLoansWithStatusFilter()
    {
        var author = await CreateAuthorAsync("André Status");
        var activeBook = await CreateBookAsync(author.IdAuthor, "Atlas Active", "9788506666661", quantity: 2);
        var returnedBook = await CreateBookAsync(author.IdAuthor, "Atlas Returned", "9788506666662", quantity: 2);

        var activeLoan = await CreateLoanAsync(activeBook.IdBook, "Amanda Active");
        var returnedLoan = await CreateLoanAsync(returnedBook.IdBook, "Arthur Returned");

        var returnResponse = await _client.PutAsync(
            new Uri($"/loan/{returnedLoan.Id}", UriKind.Relative),
            content: null,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(HttpStatusCode.OK, returnResponse.StatusCode);

        var activeListResponse = await _client.GetAsync(
            new Uri("/loan?status=Active&page=1&size=100", UriKind.Relative),
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, activeListResponse.StatusCode);

        var activeList = await DeserializeResponseAsync<PagedResultResponse<LoanGetResponse>>(activeListResponse);
        Assert.NotNull(activeList);
        Assert.Contains(activeList!.Items, l => l.Id == activeLoan.Id);
        Assert.DoesNotContain(activeList.Items, l => l.Id == returnedLoan.Id);

        var returnedListResponse = await _client.GetAsync(
            new Uri("/loan?status=Returned&page=1&size=100", UriKind.Relative),
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, returnedListResponse.StatusCode);

        var returnedList = await DeserializeResponseAsync<PagedResultResponse<LoanGetResponse>>(returnedListResponse);
        Assert.NotNull(returnedList);
        Assert.Contains(returnedList!.Items, l => l.Id == returnedLoan.Id);
        Assert.DoesNotContain(returnedList.Items, l => l.Id == activeLoan.Id);
    }
}
