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
import { catchError, map, finalize, switchMap } from 'rxjs/operators'; // switchMap is here!

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

  selectedFiles?: FileList;
  currentFileUpload?: { file: File; name: string; key: string };
  percentage = 0;
  fileUploads: FileUpload[] = [];
  error: string | null = null;
  loading = false;
  uploadTask?: UploadTask;
  uploadProgress: Observable<number> | null = null;
  downloadURL: Observable<string> | null = null;
  uploadStatus: string | null = null; // Add uploadStatus

  ngOnInit(): void {
    this.loadFiles();
  }

  selectFile(event: any): void {
    this.selectedFiles = event.target.files;
    this.error = null;
    this.percentage = 0;
    this.downloadURL = null;
    this.uploadStatus = null; // Reset uploadStatus
  }

  upload(): void {
    if (this.selectedFiles) {
      const file: File | null = this.selectedFiles.item(0);
      this.selectedFiles = undefined;

      if (file) {
        this.currentFileUpload = {
          file: file,
          name: file.name,
          key: '',
        };

        const storageRef = ref(this.storage, `materials/${file.name}`);
        this.uploadTask = uploadBytesResumable(storageRef, file);

        // --- Progress Monitoring and Status Updates ---
        this.uploadProgress = new Observable<number>((observer) => {
          this.uploadTask!.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
              this.percentage = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              );
              observer.next(this.percentage);
              this.uploadStatus = snapshot.state; // Update uploadStatus
            },
            (error) => {
              console.error('Upload Error:', error);
              this.error = 'Upload failed: ' + error.message;
              this.uploadStatus = 'error'; // Set status to error
              observer.error(error);
            },
            () => {
              this.uploadStatus = 'success'; // Set status to success
              observer.complete();
              // Get download URL *here*, inside the 'complete' handler
              getDownloadURL(this.uploadTask!.snapshot.ref).then((url) => {
                this.downloadURL = of(url);
                if (this.currentFileUpload) {
                  const uploadedFile: FileUpload = {
                    url: url,
                    name: this.currentFileUpload.name,
                    key: this.currentFileUpload.key,
                  };
                  this.fileUploads.push(uploadedFile);
                  this.currentFileUpload = undefined;
                }
              }).catch((error) => {
                console.error('Download URL Error:', error);
                this.error = 'Failed to get download URL: ' + error.message;
              });
            }
          );
        });
      }
    }
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

  loadFiles() {
    this.loading = true;
    const storageRef = ref(this.storage, 'materials/');
    this.listFiles(storageRef)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((fileUploads) => {
        this.fileUploads = fileUploads;
      });
  }

  private listFiles(storageReference: StorageReference): Observable<FileUpload[]> {
    return from(listAll(storageReference)).pipe(
      switchMap((listResult: ListResult) => { //switchMap is used here
        if (listResult.items.length === 0) {
          return of([]);
        }

        const downloadUrlObservables = listResult.items.map((itemRef) =>
          from(getDownloadURL(itemRef)).pipe(
            map((url) => ({
              url: url,
              name: itemRef.name,
              key: '',
            })),
            catchError((err) => {
              console.error('Error getting download URL for', itemRef.name, err);
              return of(null);
            })
          )
        );

        return forkJoin(downloadUrlObservables).pipe(
          map((results) =>
            results.filter((result): result is FileUpload => result !== null)
          )
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
          return of(null);
        })
      )
      .subscribe(() => {
        this.fileUploads = this.fileUploads.filter(
          (f) => f.name !== fileUpload.name
        );
      });
  }
}
