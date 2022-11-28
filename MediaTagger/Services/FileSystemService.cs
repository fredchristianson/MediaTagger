using MediaTagger.Data;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Threading;

namespace MediaTagger.Services
{
  public class FileSystemService : IHostedService
  {
    private IBackgroundMessageService messageService;

    public FileSystemService(IBackgroundMessageService messageService)
    {
      this.messageService = messageService;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
      Task.Run(async () =>
      {

        //_ = Task.Run(()=>ScanDirectory("x:\\photo_reorg", cancellationToken));
        var found = ScanDirectory("x:\\photo-reorg", Array.AsReadOnly(DefaultData.FileExtensions), cancellationToken);
        foreach(var file in found.Result)
        {
         // Console.WriteLine(file);
        }
        while (!cancellationToken.IsCancellationRequested)
        {
          //Console.WriteLine($"Respponse from IHostedService - {DateTime.Now}");
          await Task.Delay(1000);
        }
        return Task.CompletedTask;
      });
      return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {

      return Task.CompletedTask;
    }


    protected async Task<IList<string>> ScanDirectory(string path, IList<string> extensions, CancellationToken stoppingToken)
    {
      List<string> result = new List<string>();
      try
      {
        var files = Directory.GetFiles(path);
        var fileMatch = files.Where(filePath =>
        {
          var file = new FileInfo(filePath);
          return extensions.Contains(file.Extension.ToLower());
        }
        );
        result.AddRange(fileMatch);

        var subDirectories = Directory.GetDirectories(path);
        foreach(string dir in subDirectories)
        {
          if (stoppingToken.IsCancellationRequested)
          {
            messageService.Add("Scan canceled");
            return result;
          }
          result.AddRange(await ScanDirectory(dir, extensions, stoppingToken));
        }
      } catch(Exception ex)
      {
        messageService.Add("error scanning {path}", ex);
      }
      
      return result;
    }
  }
}
