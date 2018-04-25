using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Rpc.WebTest.Models;

namespace Rpc.WebTest.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
