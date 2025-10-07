using System.ComponentModel.DataAnnotations;
using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.Extensions.Configuration;

namespace SanxiaJCI
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string name, string fromEmail, string subject, string message);
    }
public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task<bool> SendEmailAsync(string name, string fromEmail, string subject, string message)
        {
            try
            {
                var email = new MimeMessage();
                email.From.Add(new MailboxAddress("三峽青年商會官方網站信息", _config["EmailSettings:Username"]));
                email.To.Add(MailboxAddress.Parse(_config["EmailSettings:Receiver"]));
                email.Subject = string.IsNullOrWhiteSpace(subject) ? "聯絡表單訊息" : subject;
                email.Body = new TextPart("plain")
                {
                    Text = $"姓名：{name}\nEmail：{fromEmail}\n\n{message}"
                };


                using var smtp = new SmtpClient();
                smtp.ServerCertificateValidationCallback = (s, c, h, e) => true;
                await smtp.ConnectAsync(_config["EmailSettings:SmtpServer"], int.Parse(_config["EmailSettings:Port"]), true);
                await smtp.AuthenticateAsync(_config["EmailSettings:Username"], _config["EmailSettings:Password"]);
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);

                return true;
            }
            catch
            {
                return false;
            }
        }
    }

}