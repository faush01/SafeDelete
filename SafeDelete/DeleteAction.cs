using MediaBrowser.Controller.Library;
using MediaBrowser.Model.IO;
using MediaBrowser.Model.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace SafeDelete
{
    public class DeleteAction
    {
        private IFileSystem _fs = null;
        private ILibraryManager _lm = null;
        private ILogger _logger = null;
        private List<FileSystemMetadata> del_paths = null;
        private string recycle_path = null;
        private List<string> action_messages = new List<string>();
        private bool action_result = false;
        private bool in_progress = false;

        public string ActionId { set; get; }

        public DeleteAction(IFileSystem fs, ILibraryManager lm, ILogger logger, List<FileSystemMetadata> dp, string rp)
        {
            _fs = fs;
            _lm = lm;
            _logger = logger;
            del_paths = dp;
            recycle_path = rp;
        }

        public bool GetStatus()
        {
            return in_progress;
        }

        public bool GetActionResult()
        {
            return action_result;
        }

        public List<string> GetActionMessages()
        {
            return action_messages;
        }

        public void RunBackgroundAction()
        {
            System.Threading.Tasks.Task.Run(() => BackgroundAction());
        }

        //private async System.Threading.Tasks.Task BackgroundAction()
        private void BackgroundAction()
        {
            _logger.Info("BackgroundAction Started");
            in_progress = true;
            try
            {
                ProcessAction();
            }
            catch(Exception e)
            {
                action_messages.Add(e.Message);
            }
            in_progress = false;
            _logger.Info("BackgroundAction Finished");
        }

        private void ProcessAction()
        {
            _logger.Info("ProcessAction() Started");

            // do file moves
            string time_stamp = DateTime.Now.ToString("yyyy-MM-dd-HH-mm-ss-fff");
            int item_number = 0;

            action_messages.Add("Moving Items");
            action_result = true;

            foreach (var del_item in del_paths)
            {
                _logger.Info("Item Delete Path: " + del_item.FullName);

                FileSystemMetadata fsm = _fs.GetDirectoryInfo(del_item.FullName);
                string destination = System.IO.Path.Combine(recycle_path, time_stamp, item_number.ToString());
                _logger.Info("Item Delete Destination Path: " + destination);

                action_messages.Add(del_item.FullName + " -> " + destination);

                if (del_item.IsDirectory)
                {
                    try
                    {
                        _fs.CreateDirectory(destination);
                        destination = System.IO.Path.Combine(destination, fsm.Name);
                        _fs.MoveDirectory(del_item.FullName, destination);
                    }
                    catch (Exception e)
                    {
                        action_result = false;
                        action_messages.Add(e.Message);
                    }
                }
                else
                {
                    try
                    {
                        _fs.CreateDirectory(destination);
                        destination = System.IO.Path.Combine(destination, fsm.Name);
                        _fs.MoveFile(del_item.FullName, destination);
                    }
                    catch (Exception e)
                    {
                        action_result = false;
                        action_messages.Add(e.Message);
                    }
                }

                if (!action_result)
                {
                    break;
                }

                item_number++;
            }

            if (action_result)
            {
                action_messages.Add("Items Moved");
                _lm.QueueLibraryScan();
                action_messages.Add("LibraryScan Queued");
            }

            _logger.Info("ProcessAction() Finished");
        }
    }
}
