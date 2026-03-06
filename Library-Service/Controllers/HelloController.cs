using Microsoft.AspNetCore.Mvc;

namespace Library_Service.Controllers;

[ApiController]
[Route("/")]
public class HelloController() : ControllerBase
{
    [HttpGet(Name = "GetHello")]
    public string Get()
    {
        return "Library API!";
    }
}