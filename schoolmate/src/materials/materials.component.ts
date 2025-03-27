import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  ListResult,
  StorageReference,
  UploadTask,
  UploadTaskSnapshot,
} from '@angular/fire/storage';
import { Observable, from, of, forkJoin } from 'rxjs';
import { catchError, map, finalize, switchMap } from 'rxjs/operators';
import { Auth, user } from '@angular/fire/auth';

interface FileUpload {
  key: string;
  name: string;
  url: string;
}

@Component({
  selector: 'app-materials',
  templateUrl: './materials.component.html',
  styleUrls: ['./materials.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule], // Add FormsModule here
})
export class MaterialsComponent implements OnInit {
  private storage: Storage = inject(Storage);
  private auth: Auth = inject(Auth);
  user$ = user(this.auth);
  userId: string | null = null;

  selectedFiles?: FileList;
  selectedFileName: string = '';
  currentFileUpload?: { file: File; name: string; key: string };
  percentage = 0;
  fileUploads: FileUpload[] = [];
  error: string | null = null;
  loading = false;
  uploadTask?: UploadTask;
  uploadProgress: Observable<number> | null = null;
  downloadURL: Observable<string> | null = null;
  uploadStatus: string | null = null;
  userLoading = true;
  showProgressBar = false;

  // Folder Selection
  selectedFolder: string = 'general/'; // Default folder
  folders = [
    { label: 'General', value: 'general/' },
    { label: 'Mathematics', value: 'maths/' },
    { label: 'English Language', value: 'english/' },
    { label: 'Openlab', value: 'openlab/' },
  ];

  // File Type Selection
  selectedFileType: string = 'all'; // Default to show all files
  fileTypes = [
    { label: 'All Files', value: 'all' },
    { label: 'Documents (.docx, .pdf, .doc)', value: '.docx, .pdf, .doc' }, // Comma-separated
    { label: 'Presentations (.pptx)', value: '.pptx' },
    { label: 'Images (.jpg, .png, .gif)', value: '.jpg,.png,.gif' },
    // Add more file types as needed
  ];


  ngOnInit(): void {
    this.user$.subscribe((user) => {
      if (user) {
        this.userId = user.uid;
      } else {
        this.userId = null;
      }
      this.loadFiles();
      this.userLoading = false;
    });
  }

  selectFile(event: any): void {
    this.selectedFiles = event.target.files;
    this.selectedFileName = this.selectedFiles?.item(0)?.name || '';
    this.error = null;
    this.percentage = 0;
    this.downloadURL = null;
    this.uploadStatus = null;
    this.showProgressBar = false;
  }


  upload(): void {
    if (this.userLoading || !this.userId || !this.selectedFiles) {
      this.error = this.userLoading ? 'Waiting for user authentication...' : 'User not authenticated or no files selected.';
      return;
    }

    const file: File | null = this.selectedFiles.item(0);
    this.selectedFiles = undefined;

    if (!file) {
      this.error = 'File is null or undefined.';
      return;
    }

    this.currentFileUpload = { file: file, name: file.name, key: '' };
    // Use selectedFolder here:
    const storageRef = ref(this.storage, `materials/${this.selectedFolder}${file.name}`);
    this.uploadTask = uploadBytesResumable(storageRef, file);
    this.showProgressBar = true;

    this.uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        this.percentage = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        this.uploadStatus = snapshot.state;
      },
      (error) => {
        console.error('Upload Error:', error);
        this.error = 'Upload failed: ' + error.message;
        this.uploadStatus = 'error';
        this.showProgressBar = false;
      },
      () => {
        this.uploadStatus = 'success';
        getDownloadURL(this.uploadTask!.snapshot.ref)
          .then((url) => {
            if (this.currentFileUpload) {
              const uploadedFile: FileUpload = {
                url: url,
                name: this.currentFileUpload.name,
                key: this.currentFileUpload.key,
              };
              this.fileUploads.push(uploadedFile);
              this.currentFileUpload = undefined;
              this.loadFiles(); //refresh
              this.showProgressBar = false;
              this.percentage = 0;
              this.selectedFileName = '';
            }
          })
          .catch((error) => {
            console.error('Download URL Error:', error);
            this.error = 'Failed to get download URL: ' + error.message;
            this.showProgressBar = false;
          });
      }
    );
  }
  pauseUpload() {
    if (this.uploadTask) {
      this.uploadTask.pause();
    }
  }

  resumeUpload() {
    if (this.uploadTask) {
      this.uploadTask.resume();
    }
  }

  cancelUpload() {
    if (this.uploadTask) {
      this.uploadTask.cancel();
    }
  }

  loadFiles(): void {
    this.loading = true;
    const storageRef = ref(this.storage, `materials/${this.selectedFolder}`);
    this.listFiles(storageRef)
      .pipe(
        finalize(() => (this.loading = false)),
        map(fileUploads => this.filterFilesByType(fileUploads)) // Filter by type *after* listing
      )
      .subscribe((fileUploads) => {
        this.fileUploads = fileUploads.sort((a, b) => a.name.localeCompare(b.name));
      });
  }


  private listFiles(storageReference: StorageReference): Observable<FileUpload[]> {
    return from(listAll(storageReference)).pipe(
      switchMap((listResult: ListResult) => {
        if (listResult.items.length === 0) {
          return of([]);
        }

        const downloadUrlObservables = listResult.items.map((itemRef) =>
          from(getDownloadURL(itemRef)).pipe(
            map((url) => ({ url: url, name: itemRef.name, key: '' })),
            catchError((err) => {
              console.error('Error getting download URL for', itemRef.name, err);
              return of(null);
            })
          )
        );

        return forkJoin(downloadUrlObservables).pipe(
          map((results) => results.filter((result): result is FileUpload => result !== null))
        );
      })
    );
  }
  // Add filtering logic
  private filterFilesByType(fileUploads: FileUpload[]): FileUpload[] {
    if (this.selectedFileType === 'all') {
      return fileUploads; // No filtering needed
    }

    const allowedExtensions = this.selectedFileType.split(',');
    return fileUploads.filter(fileUpload => {
      const fileExtension = '.' + fileUpload.name.split('.').pop()!.toLowerCase(); // Get lowercase extension
      return allowedExtensions.includes(fileExtension);
    });
  }


  deleteFileUpload(fileUpload: FileUpload): void {
    this.error = null;
    // Delete from the correct path:
    const storageRef = ref(this.storage, `materials/${this.selectedFolder}${fileUpload.name}`);

    from(deleteObject(storageRef))
      .pipe(
        catchError((error) => {
          console.error('Delete Error:', error);
          this.error = 'Delete failed: ' + error.message;
          return of(null);
        })
      )
      .subscribe(() => {
        this.fileUploads = this.fileUploads.filter((f) => f.name !== fileUpload.name);
      });
  }
}
