using Microsoft.AspNetCore.Mvc;

namespace SanxiaJCI.Controllers
{
    public class MeetingController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IEmailService _emailService;

        public MeetingController(ILogger<HomeController> logger, IEmailService emailService)
        {
            _logger = logger;
            _emailService = emailService;
        }
        public IActionResult Index()
        {
            return View();
        }
        public IActionResult International()
        {
            return View();
        }
    }
}
