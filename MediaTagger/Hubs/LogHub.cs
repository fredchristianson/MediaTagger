using Microsoft.AspNetCore.SignalR;

namespace MediaTagger.Hubs
{
  public class LogHub : Hub
  {
    public async Task SendMessage(string message)
    {
      await Clients.All.SendAsync("LogMessage", message);
    }
  }
}
