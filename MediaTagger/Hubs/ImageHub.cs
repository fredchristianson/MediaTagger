using Microsoft.AspNetCore.SignalR;

namespace MediaTagger.Hubs
{
  public abstract class IImageHub : Hub
  {
    public abstract Task SendMessage(string message);
  }
  public class ImageHub :  IImageHub
  {
    public async override Task SendMessage(string message)
    {
      await Clients.All.SendAsync("Update", message);
    }

    }
}
