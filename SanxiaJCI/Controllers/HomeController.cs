using System.Diagnostics;
using SanxiaJCI.Models;
using Microsoft.AspNetCore.Mvc;

namespace SanxiaJCI.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IEmailService _emailService;

        public HomeController(ILogger<HomeController> logger, IEmailService emailService)
        {
            _logger = logger;
            _emailService = emailService;
        }

        [HttpGet]
        public IActionResult Index()
        {
            /// cop = ""..
            ViewBag.Tag = "Luisa";
            TempData["Tag"] = "Starbuck";
            return View();
        }
        [HttpPost]
        public IActionResult Index(string name)
        {
            return View();
        }
        [HttpGet]
        public IActionResult About()
        {
            return View();
        }
        [HttpPost]
        public IActionResult Login()
        {
            //var autrh = true;
            return RedirectToAction("Index");
        }

        public IActionResult Contact()
        {
            return View();
        }


        [HttpPost]
        public async Task<IActionResult> SendEmail([FromBody] ContactFormModel model)
        {
            if (ModelState.IsValid)
            {
                bool result = await _emailService.SendEmailAsync(model.Name, model.Email, model.Subject, model.Message);
                if (result)
                    return Ok(new { message = "郵件寄送成功" });
                else
                    return BadRequest(new { message = "郵件寄送失敗，請稍後再試" });
            }

            return BadRequest(new { message = "資料驗證失敗" });
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
