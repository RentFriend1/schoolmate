import { Component, OnInit, inject } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { Firestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import FormsModule

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, FormsModule], // Add FormsModule to imports
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  postTitle: string = '';
  postCategory: string = '';
  postDescription: string = '';
  responseText: { [key: string]: string } = {}; // Store response text for each post
  posts: any[] = [];
  editingPostId: string | null = null;
  selectedResponse: { [key: string]: string | null } = {}; // Add property to track selected response for each post

  async ngOnInit() {
    await this.loadPosts(); // Ensure loadPosts is called when the component initializes
  }

  get currentUser() {
    return this.auth.currentUser;
  }

  async createPost() {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      const post = {
        title: this.postTitle,
        category: this.postCategory,
        description: this.postDescription,
        author: currentUser.displayName,
        authorId: currentUser.uid,
        createdAt: serverTimestamp(),
        responses: []
      };
      const docRef = await addDoc(collection(this.firestore, 'posts'), post);
      this.posts.push({ id: docRef.id, ...post, createdAt: new Date() });
      this.postTitle = '';
      this.postCategory = '';
      this.postDescription = '';
    } else {
      console.warn('No authenticated user found.');
    }
  }

  async loadPosts() {
    const querySnapshot = await getDocs(collection(this.firestore, 'posts'));
    this.posts = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data['createdAt'] ? (data['createdAt'].toDate ? data['createdAt'].toDate() : new Date(data['createdAt'])) : null,
        editedAt: data['editedAt'] ? (data['editedAt'].toDate ? data['editedAt'].toDate() : new Date(data['editedAt'])) : null
      };
    });
  }

  async deletePost(postId: string) {
    await deleteDoc(doc(this.firestore, 'posts', postId));
    this.posts = this.posts.filter(post => post.id !== postId);
  }

  async updatePost() {
    if (this.editingPostId) {
      const postRef = doc(this.firestore, 'posts', this.editingPostId);
      await updateDoc(postRef, {
        title: this.postTitle,
        category: this.postCategory,
        description: this.postDescription,
        editedAt: serverTimestamp() // Add editedAt field
      });
      const updatedPost = this.posts.find(post => post.id === this.editingPostId);
      if (updatedPost) {
        updatedPost.title = this.postTitle;
        updatedPost.category = this.postCategory;
        updatedPost.description = this.postDescription;
        updatedPost.editedAt = new Date(); // Update the local post object
      }
      this.editingPostId = null;
      this.postTitle = '';
      this.postCategory = '';
      this.postDescription = '';
    }
  }

  async addResponse(postId: string) {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      const response = {
        text: this.responseText[postId],
        author: currentUser.displayName,
        authorId: currentUser.uid, // Add authorId field
        createdAt: new Date() // Set createdAt separately
      };
      const postRef = doc(this.firestore, 'posts', postId);
      await updateDoc(postRef, {
        responses: arrayUnion(response)
      });
      const post = this.posts.find(post => post.id === postId);
      if (post) {
        if (!post.responses) {
          post.responses = [];
        }
        post.responses.push(response);
      }
      this.responseText[postId] = ''; // Clear the response text for the specific post
    } else {
      console.warn('No authenticated user found.');
    }
  }

  async deleteResponse(postId: string, response: any) {
    const postRef = doc(this.firestore, 'posts', postId);
    await updateDoc(postRef, {
      responses: arrayRemove(response)
    });
    const post = this.posts.find(post => post.id === postId);
    if (post) {
      post.responses = post.responses.filter((r: any) => r !== response);
    }
  }

  startEditing(post: any) {
    const currentUser = this.auth.currentUser;
    if (currentUser && post.authorId === currentUser.uid) {
      this.editingPostId = post.id;
      this.postTitle = post.title;
      this.postCategory = post.category;
      this.postDescription = post.description;
    } else {
      console.warn('You are not authorized to edit this post.');
    }
  }

  selectResponse(postId: string, responseId: string) {
    this.selectedResponse[postId] = responseId;
  }
}
