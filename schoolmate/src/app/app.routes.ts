import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomepageComponent } from '../homepage/homepage.component';
import { PostDescriptionComponent } from '../post-description/post-description.component';

export const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'post/:id', component: PostDescriptionComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
