import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, deleteDoc } from '@angular/fire/firestore'; // Import deleteDoc
import { Auth } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-post-description',
  templateUrl: './post-description.component.html',
  styleUrls: ['./post-description.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PostDescriptionComponent implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  post: any = null;
  responseText: string = '';
  editingPostId: string | null = null;
  selectedResponse: string | null = null;

  constructor(private route: ActivatedRoute) { }

  async ngOnInit() {
    const postId = this.route.snapshot.paramMap.get('id');
    if (postId) {
      const postDoc = await getDoc(doc(this.firestore, 'posts', postId));
      if (postDoc.exists()) {
        this.post = { id: postDoc.id, ...postDoc.data() };
      }
    }
  }

  get currentUser() {
    return this.auth.currentUser;
  }

  async addResponse() {
    const currentUser = this.auth.currentUser;
    if (currentUser && this.post) {
      const response = {
        id: uuidv4(),
        text: this.responseText,
        author: currentUser.displayName,
        authorId: currentUser.uid,
        createdAt: new Date()
      };
      const postRef = doc(this.firestore, 'posts', this.post.id);
      await updateDoc(postRef, {
        responses: arrayUnion(response)
      });
      if (!this.post.responses) {
        this.post.responses = [];
      }
      this.post.responses.push(response);
      this.responseText = '';
    } else {
      console.warn('No authenticated user found.');
    }
  }

  async deleteResponse(response: any) {
    if (this.post) {
      const postRef = doc(this.firestore, 'posts', this.post.id);
      await updateDoc(postRef, {
        responses: arrayRemove(response)
      });
      this.post.responses = this.post.responses.filter((r: any) => r !== response);
    }
  }

  startEditing() {
    const currentUser = this.auth.currentUser;
    if (currentUser && this.post && this.post.authorId === currentUser.uid) {
      this.editingPostId = this.post.id;
    } else {
      console.warn('You are not authorized to edit this post.');
    }
  }

  async updatePost() {
    if (this.editingPostId) {
      const postRef = doc(this.firestore, 'posts', this.editingPostId);
      await updateDoc(postRef, {
        title: this.post.title,
        category: this.post.category,
        description: this.post.description,
        editedAt: serverTimestamp()
      });
      this.editingPostId = null;
    }
  }

  async deletePost() {
    const currentUser = this.auth.currentUser;
    if (currentUser && this.post && this.post.authorId === currentUser.uid) {
      const postRef = doc(this.firestore, 'posts', this.post.id);
      await deleteDoc(postRef);
      this.post = null;
    } else {
      console.warn('You are not authorized to delete this post.');
    }
  }

  selectResponse(responseId: string) {
    this.selectedResponse = responseId;
  }
}

