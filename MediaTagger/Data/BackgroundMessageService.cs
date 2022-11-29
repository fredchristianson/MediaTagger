using MediaTagger.Hubs;
using Microsoft.AspNetCore.SignalR;
using System.Collections;

namespace MediaTagger.Data
{
  public interface IBackgroundMessageService
  {
    void Add(string message);
    void Add(string message, Exception ex);
    }
  /* messages from background tasks that will be displayed */
    public class BackgroundMessageService : IBackgroundMessageService
    {

    private List<string> queuedMessages = new List<string>();
        private IHubContext<ILogHub> hubContext;

        public BackgroundMessageService(IHubContext<ILogHub> hubContext) {
      this.hubContext = hubContext;
      
    }

    public void Add(string message)
    {
      queuedMessages.Add(message);
      //var logHub = new LogHub();
      //hubContext.Clients.All.SendMessage(message);
      hubContext.Clients.All.SendAsync("log",message);
    }

    public void Add(string message, Exception ex)
    {
      queuedMessages.Add(message + ": " + ex.Message);
    }

    }
}
