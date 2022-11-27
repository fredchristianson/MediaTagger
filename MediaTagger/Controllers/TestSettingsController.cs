using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using MediaTagger.Data;
using MediaTagger.Models;

namespace MediaTagger.Controllers
{
    public class TestSettingsController : Controller
    {
        private readonly MediaTaggerContext _context;

        public TestSettingsController(MediaTaggerContext context)
        {
            _context = context;
        }

        // GET: TestSettings
        public async Task<IActionResult> Index()
        {
              return View(await _context.Settings.ToListAsync());
        }

        // GET: TestSettings/Details/5
        public async Task<IActionResult> Details(string id)
        {
            if (id == null || _context.Settings == null)
            {
                return NotFound();
            }

            var setting = await _context.Settings
                .FirstOrDefaultAsync(m => m.Scope == id);
            if (setting == null)
            {
                return NotFound();
            }

            return View(setting);
        }

        // GET: TestSettings/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: TestSettings/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Scope,Name,Value")] Setting setting)
        {
            if (ModelState.IsValid)
            {
                _context.Add(setting);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(setting);
        }

        // GET: TestSettings/Edit/5
        public async Task<IActionResult> Edit(string id)
        {
            if (id == null || _context.Settings == null)
            {
                return NotFound();
            }

            var setting = await _context.Settings.FindAsync(id);
            if (setting == null)
            {
                return NotFound();
            }
            return View(setting);
        }

        // POST: TestSettings/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(string id, [Bind("Scope,Name,Value")] Setting setting)
        {
            if (id != setting.Scope)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(setting);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!SettingExists(setting.Scope))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw;
                    }
                }
                return RedirectToAction(nameof(Index));
            }
            return View(setting);
        }

        // GET: TestSettings/Delete/5
        public async Task<IActionResult> Delete(string id)
        {
            if (id == null || _context.Settings == null)
            {
                return NotFound();
            }

            var setting = await _context.Settings
                .FirstOrDefaultAsync(m => m.Scope == id);
            if (setting == null)
            {
                return NotFound();
            }

            return View(setting);
        }

        // POST: TestSettings/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(string id)
        {
            if (_context.Settings == null)
            {
                return Problem("Entity set 'MediaTaggerContext.Settings'  is null.");
            }
            var setting = await _context.Settings.FindAsync(id);
            if (setting != null)
            {
                _context.Settings.Remove(setting);
            }
            
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool SettingExists(string id)
        {
          return _context.Settings.Any(e => e.Scope == id);
        }
    }
}
