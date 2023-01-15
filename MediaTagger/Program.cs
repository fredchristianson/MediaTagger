using MediaTagger.Data;
using Microsoft.EntityFrameworkCore;
using MediaTagger.Interfaces;
using MediaTagger.Modules.BackgroundTasks;
using MediaTagger.Modules.BackgroundTasks.Workers;

var builder = WebApplication.CreateBuilder(args);
// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSingleton<IBackgroundTaskQueue, BackgroundTaskQueue>();
builder.Services.AddSingleton<IPeriodicWorkerRunner, PeriodicWorkerRunner>();
builder.Services.AddHostedService<BackgroundTaskManager>();
builder.Services.RegisterModules();
builder.Services.AddHttpContextAccessor();
builder.Services.AddDbContext<MediaTaggerContext>(options =>
  options.UseSqlServer(builder.Configuration.GetConnectionString("MediaTaggerContext")));


builder.Services.AddSession();
//builder.Services.AddHostedService<FileSystemService>();
builder.WebHost.UseUrls("https://localhost:7094", "http://192.168.10.129:8094");
var app = builder.Build();


// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

// app.Use(async (context, next) =>
// {
//     context.Response.Headers.Add("Content-Security-Policy", "default-src 'self' 'unsafe-inline'");
//     await next();
// });



//app.UseHttpsRedirection();
app.UseStaticFiles(new StaticFileOptions
{
    ServeUnknownFileTypes = true
    //   OnPrepareResponse = context =>
    //   {
    //       if (!context.Context.Response.Headers.TryAdd("Content-Security-Policy", 
    //           "default-src 'self'")) {
    //            StringValues values = new StringValues();
    //             var current = context.Context.Response.Headers.TryGetValue("content-security-policy",out values);
    //           }
    //   }
});

app.UseRouting();

app.UseAuthorization();
app.UseSession();
app.MapRazorPages();
app.UseDeveloperExceptionPage();

app.MapEndpoints();
try
{
    //app.Services.CreateScope().ServiceProvider.GetService<FileScanWorker>();
    var backgroundTaskQueue = app.Services.GetRequiredService<IBackgroundTaskQueue>();
    backgroundTaskQueue.CreateWorker<FileScanWorker>();
    var periodicRunner = app.Services.GetRequiredService<IPeriodicWorkerRunner>();
    periodicRunner.ScheduleWorker<CleanTempFilesWorker>(10);
    //periodicRunner.ScheduleWorker<TestWorker>(3, 10);
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine(ex);
}
