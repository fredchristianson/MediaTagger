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
    public BackgroundMessageService() { }

    public void Add(string message)
    {
      queuedMessages.Add(message);
    }

    public void Add(string message, Exception ex)
    {
      queuedMessages.Add(message + ": " + ex.Message);
    }

    private List<string> queuedMessages = new List<string>();
    }
}
