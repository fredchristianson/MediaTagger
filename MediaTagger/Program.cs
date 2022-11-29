using MediaTagger.Data;
using Microsoft.EntityFrameworkCore;
using MediaTagger.Services;
using MediaTagger.Modules.Tag;
using MediaTagger.Interfaces;
using Microsoft.Extensions.Hosting.Internal;
using MediaTagger.Modules.BackgroundTasks;
using MediaTagger.Modules.BackgroundTasks.workers;

var builder = WebApplication.CreateBuilder(args);
// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSingleton<IBackgroundTaskQueue,BackgroundTaskQueue>();
builder.Services.AddHostedService<BackgroundTaskManager>();
builder.Services.RegisterModules();
builder.Services.AddDbContext<MediaTaggerContext>(options =>
  options.UseSqlServer(builder.Configuration.GetConnectionString("MediaTaggerContext")));

builder.Services.AddSingleton<IBackgroundMessageService,BackgroundMessageService>();
builder.Services.AddSession();
//builder.Services.AddHostedService<FileSystemService>();
var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
  app.UseExceptionHandler("/Error");
  // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
  app.UseHsts();
}


using (var scope = app.Services.CreateScope())
{
  var services = scope.ServiceProvider;

  var context = services.GetRequiredService<MediaTaggerContext>();
  context.Database.EnsureCreated();
  // DbInitializer.Initialize(context);
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();
app.UseSession();
app.MapRazorPages();
app.UseDeveloperExceptionPage();

//app.MapTagEndpoints();
app.MapEndpoints();
try
{
  app.Services.CreateScope().ServiceProvider.GetService<FileScanWorker>();
  app.Run();
} catch(Exception ex) { 
  Console.WriteLine(ex); 
}
