import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
})
export class MaterialsComponent implements OnInit {
  private storage: Storage = inject(Storage);
  private auth: Auth = inject(Auth);
  user$ = user(this.auth);
  userId: string | null = null;

  selectedFiles?: FileList;
  currentFileUpload?: { file: File; name: string; key: string };
  percentage = 0;
  fileUploads: FileUpload[] = [];
  error: string | null = null;
  loading = false;
  uploadTask?: UploadTask;
  uploadProgress: Observable<number> | null = null;
  downloadURL: Observable<string> | null = null;
  uploadStatus: string | null = null;
  userLoading = true; // Flag for user authentication loading

  ngOnInit(): void {
    this.user$.subscribe((user) => {
      if (user) {
        this.userId = user.uid;
      } else {
        this.userId = null;
      }
      this.loadFiles(); // Load files regardless of user authentication
      this.userLoading = false; // Set loading to false after getting user (or lack thereof)
    });
  }

  selectFile(event: any): void {
    this.selectedFiles = event.target.files;
    this.error = null;
    this.percentage = 0;
    this.downloadURL = null;
    this.uploadStatus = null;
    console.log('Selected files:', this.selectedFiles); // Debug: Check selected files
  }

  upload(): void {
    console.log('upload() method called');

    if (this.userLoading) {
      console.log('Waiting for user authentication...');
      this.error = 'Waiting for user authentication...';
      return; // Prevent upload until user is loaded
    }

    if (!this.userId) {
      this.error = 'User not authenticated. Please log in.';
      console.log('User not authenticated');
      return; // Prevent upload if not authenticated
    }

    if (!this.selectedFiles) {
      console.log('No files selected.');
      this.error = 'No files selected.';
      return;
    }

    const file: File | null = this.selectedFiles.item(0);
    this.selectedFiles = undefined; // Clear selected files *after* getting the file

    if (!file) {
      console.log('File is null or undefined.');
      this.error = 'File is null or undefined.'; // Should not happen, but good to check
      return;
    }
    console.log('File selected:', file);
    console.log('File name:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size);

    this.currentFileUpload = { file: file, name: file.name, key: '' };
    const storageRef = ref(this.storage, `materials/${file.name}`);
    console.log('storageRef:', storageRef);

    this.uploadTask = uploadBytesResumable(storageRef, file);
    console.log('uploadTask created:', this.uploadTask);

    this.uploadProgress = new Observable<number>((observer) => {
      this.uploadTask!.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          this.percentage = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          observer.next(this.percentage);
          this.uploadStatus = snapshot.state;
          console.log('Upload progress:', this.percentage, 'State:', this.uploadStatus);
        },
        (error) => {
          console.error('Upload Error:', error);
          this.error = 'Upload failed: ' + error.message;
          this.uploadStatus = 'error';
          observer.error(error);
        },
        () => {
          this.uploadStatus = 'success';
          observer.complete();
          console.log('Upload complete!');
          getDownloadURL(this.uploadTask!.snapshot.ref)
            .then((url) => {
              console.log('Download URL:', url);
              this.downloadURL = of(url);
              if (this.currentFileUpload) {
                const uploadedFile: FileUpload = {
                  url: url,
                  name: this.currentFileUpload.name,
                  key: this.currentFileUpload.key, // Consider generating a unique key if needed
                };
                this.fileUploads.push(uploadedFile); // Add to the list
                this.currentFileUpload = undefined; // Clear current file
              }
            })
            .catch((error) => {
              console.error('Download URL Error:', error);
              this.error = 'Failed to get download URL: ' + error.message;
            });
        }
      );
    });
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
    console.log('loadFiles() called');

    this.loading = true;
    const storageRef = ref(this.storage, `materials`);
    console.log("storageRef in load files:", storageRef)
    this.listFiles(storageRef)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((fileUploads) => {
        this.fileUploads = fileUploads;
        console.log("files loaded", fileUploads)
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
              return of(null); // Handle errors gracefully
            })
          )
        );

        return forkJoin(downloadUrlObservables).pipe(
          map((results) => results.filter((result): result is FileUpload => result !== null))
        );
      })
    );
  }

  deleteFileUpload(fileUpload: FileUpload): void {
    this.error = null;
    const storageRef = ref(this.storage, `materials/${fileUpload.name}`);

    from(deleteObject(storageRef))
      .pipe(
        catchError((error) => {
          console.error('Delete Error:', error);
          this.error = 'Delete failed: ' + error.message;
          return of(null); // Handle delete errors
        })
      )
      .subscribe(() => {
        this.fileUploads = this.fileUploads.filter((f) => f.name !== fileUpload.name);
      });
  }
}
