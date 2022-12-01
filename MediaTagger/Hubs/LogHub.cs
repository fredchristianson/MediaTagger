using Microsoft.AspNetCore.SignalR;

namespace MediaTagger.Hubs
{
  public class LogTest
  {
    public LogTest() { }
    public int IVal { get; set; } = 1;
    public string Foo { get; set; } = "bar";
  }
  public interface ILogHub 
  {
    public Task Log(LogTest message);
    public Task Debug(string message);
  }

  public class LogHub :  Hub<ILogHub>
  {

  }
}
