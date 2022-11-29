using Microsoft.AspNetCore.SignalR;

namespace MediaTagger.Hubs
{
  public abstract class ILogHub : Hub
  {
    public abstract Task SendMessage(string message);
  }
  public class LogHub :  ILogHub
  {
    public async override Task SendMessage(string message)
    {
      await Clients.All.SendAsync("LogMessage", message);
    }

    }
}
